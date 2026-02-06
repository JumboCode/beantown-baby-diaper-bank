export async function GET() {
  return new Response(JSON.stringify({ message: "Hello World" }));
}

export async function POST() {
  return new Response(JSON.stringify({ message: "Hello World" }));
}
