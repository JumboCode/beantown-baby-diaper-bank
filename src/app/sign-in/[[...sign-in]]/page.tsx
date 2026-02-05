"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  TextInput, 
  PasswordInput, 
  Button, 
  Paper, 
  Title, 
  Container, 
  Stack,
  Center
} from "@mantine/core";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/admin"); // Redirect to admin view on success
      }
    } catch (err: any) {
      console.error("Sign-in error:", err.errors[0].message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center style={{ height: '100vh' }}>
      <Container size={420}>
        <Title ta="center" fw={900}>Admin Sign In</Title>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput 
                label="Email" 
                placeholder="you@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <PasswordInput 
                label="Password" 
                placeholder="Your password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" fullWidth loading={loading} color="blue.9">
                Sign In
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Center>
  );
}