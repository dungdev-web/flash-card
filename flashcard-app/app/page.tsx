import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen space-y-6">
      <h1 className="text-4xl font-bold">Welcome to Flashcard App</h1>
      <Image
        src="/flashcards.png"
        alt="Flashcards"
        width={300}
        height={200}
      />
      <p className="text-lg text-center max-w-md">
        Create, study, and share flashcards to enhance your learning experience!
      </p>
    </div>
  );
}
