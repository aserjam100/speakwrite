import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { audioBase64, originalText } = await request.json();

    if (!audioBase64 || !originalText) {
      return NextResponse.json(
        { error: "Missing audio or text" },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, "base64");

    // Use Azure Speech Service REST API (serverless-friendly)
    const region = process.env.AZURE_SPEECH_REGION;
    const subscriptionKey = process.env.AZURE_SPEECH_KEY;

    if (!region || !subscriptionKey) {
      throw new Error("Azure credentials not configured. Check AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local");
    }

    const pronunciationAssessmentParams = {
      ReferenceText: originalText,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
    };

    // Azure requires the header to be base64 encoded
    const pronunciationAssessmentJson = JSON.stringify(pronunciationAssessmentParams);
    const pronunciationAssessmentHeader = Buffer.from(pronunciationAssessmentJson, 'utf-8').toString('base64');

    const azureUrl = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;

    const azureResponse = await fetch(azureUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-Type": "audio/wav",
        "Accept": "application/json",
        "Pronunciation-Assessment": pronunciationAssessmentHeader,
      },
      body: audioBuffer,
    });

    if (!azureResponse.ok) {
      let errorText;
      try {
        const errorJson = await azureResponse.json();
        errorText = JSON.stringify(errorJson, null, 2);
      } catch {
        errorText = await azureResponse.text();
      }
      throw new Error(`Azure API error: ${azureResponse.status} - ${errorText}`);
    }

    const azureData = await azureResponse.json();

    // Extract pronunciation assessment results from NBest[0]
    const nbestResult = azureData.NBest?.[0];

    if (!nbestResult) {
      throw new Error("No recognition results returned from Azure");
    }

    const azureResult = {
      recognizedText: azureData.DisplayText || "",
      pronunciationAssessment: {
        accuracyScore: nbestResult.AccuracyScore || 0,
        fluencyScore: nbestResult.FluencyScore || 0,
        completenessScore: nbestResult.CompletenessScore || 0,
        pronunciationScore: nbestResult.PronScore || 0,
      },
    };

    // Send Azure results to Claude for human-friendly feedback
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `I practiced reading this text aloud: "${originalText}"

Azure Speech Service analyzed my pronunciation and gave these scores:
- Overall Pronunciation Score: ${azureResult.pronunciationAssessment.pronunciationScore}/100
- Accuracy Score: ${azureResult.pronunciationAssessment.accuracyScore}/100
- Fluency Score: ${azureResult.pronunciationAssessment.fluencyScore}/100
- Completeness Score: ${azureResult.pronunciationAssessment.completenessScore}/100

What I actually said: "${azureResult.recognizedText}"

Please provide encouraging, constructive feedback in 2-3 short paragraphs. Focus on:
1. What went well
2. Specific areas to improve
3. One practical tip for next time

Keep it friendly and motivating.`,
        },
      ],
    });

    const feedback = message.content[0].text;

    return NextResponse.json({
      feedback,
      scores: azureResult.pronunciationAssessment,
      recognizedText: azureResult.recognizedText,
    });
  } catch (error) {
    console.error("Error analyzing speech:", error);
    return NextResponse.json(
      { error: "Failed to analyze speech", details: error.message },
      { status: 500 }
    );
  }
}
