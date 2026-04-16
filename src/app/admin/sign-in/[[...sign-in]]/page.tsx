"use client";

import { useSignIn, useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Container,
  Stack,
  Center,
  Text,
  Loader,
} from "@mantine/core";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      router.push("/admin");
    }
  }, [isAuthLoaded, isSignedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setErrorMessage("");
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/admin");
      }
    } catch (err: any) {
      const message = err?.errors?.[0]?.message ?? "Incorrect email or password. Please try again.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !isAuthLoaded) {
    return (
      <Center style={{ height: "100vh", backgroundColor: "#f8f9fa" }}>
        <Loader color="#003263" size="md" />
      </Center>
    );
  }

  if (isSignedIn) {
    return (
      <Center style={{ height: "100vh", backgroundColor: "#f8f9fa" }}>
        <Stack align="center">
          <Loader color="#003263" size="md" />
          <Text c="dimmed" size="sm">You are already signed in. Redirecting...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Center style={{ height: "100vh", backgroundColor: "#f8f9fa" }}>
      <Container size={460} w="100%">
        <Stack align="center" mb="xl">
          <Image
            src="/beantown-logo.svg"
            alt="Beantown Baby Diaper Bank"
            width={300}
            height={80}
            style={{ objectFit: "contain" }}
          />
        </Stack>

        <Paper withBorder shadow="sm" p={40} radius="lg">
          <Stack align="center" gap={4} mb="xl">
            <Title order={2} fw={700}>
              Welcome!
            </Title>
            <Text c="dimmed" size="sm">
              Sign in to your account
            </Text>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Email address"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                radius="md"
                size="md"
                error={errorMessage ? true : false}
              />
              <PasswordInput
                label="Password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                radius="md"
                size="md"
                error={errorMessage ? true : false}
              />

              {errorMessage && (
                <Text c="red" size="sm" ta="center">
                  {errorMessage}
                </Text>
              )}

              <Button
                type="submit"
                fullWidth
                loading={loading}
                color="#003263"
                radius="md"
                size="md"
                mt="md"
              >
                Sign In
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Center>
  );
}
