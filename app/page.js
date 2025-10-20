import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic, PenLine } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-2xl w-full px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-light tracking-tight text-black mb-4">
            Practice
          </h1>
          <p className="text-slate-500 text-lg font-light">
            Choose your path
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/practice/speaking" className="group">
            <div className="border-2 border-black hover:bg-black transition-all duration-300 p-12 flex flex-col items-center justify-center aspect-square">
              <Mic className="w-16 h-16 mb-6 text-black group-hover:text-white transition-colors" strokeWidth={1.5} />
              <h2 className="text-2xl font-light text-black group-hover:text-white transition-colors">
                Speaking
              </h2>
            </div>
          </Link>

          <Link href="/practice/writing" className="group">
            <div className="border-2 border-black hover:bg-black transition-all duration-300 p-12 flex flex-col items-center justify-center aspect-square">
              <PenLine className="w-16 h-16 mb-6 text-black group-hover:text-white transition-colors" strokeWidth={1.5} />
              <h2 className="text-2xl font-light text-black group-hover:text-white transition-colors">
                Writing
              </h2>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
