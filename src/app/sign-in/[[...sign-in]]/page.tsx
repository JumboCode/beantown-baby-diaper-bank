"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
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
  Checkbox,
  Group,
  Anchor
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
        router.push("/admin");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err.errors[0].message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center style={{ height: '100vh', backgroundColor: '#f8f9fa' }}>
      <Container size={460} w="100%">
        <Stack align="center" mb="xl">
          <Image
            src="/beantown_logo.png"
            alt="Beantown Baby Diaper Bank"
            width={300}
            height={80}
            style={{ objectFit: 'contain' }}
          />
        </Stack>

        <Paper withBorder shadow="sm" p={40} radius="lg">
          <Stack align="center" gap={4} mb="xl">
            <Title order={2} fw={700}>Welcome !</Title>
            <Text c="dimmed" size="sm">Please enter your details.</Text>
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
              />
              <PasswordInput
                label="Password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                radius="md"
                size="md"
              />

              <Group justify="space-between" mt="xs">
                <Checkbox label="Remember me" size="sm" />
                <Anchor href="#" size="sm" fw={600} c="blue.7">
                  Forgot password?
                </Anchor>
              </Group>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                color="blue.3"
                radius="md"
                size="md"
                mt="md"
              >
                Sign In
              </Button>
            </Stack>
          </form>

          <Text ta="center" mt="xl" size="sm">
            Don&apos; t have an account?{' '}
            <Anchor href="#" fw={700} c="blue.9">
              Sign up here
            </Anchor>
          </Text>
        </Paper>
      </Container>
    </Center>
  );
}