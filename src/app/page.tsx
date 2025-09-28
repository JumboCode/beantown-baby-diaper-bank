"use client";

import { Container, Title, Text, Button } from "@mantine/core";

export default function Home() {
  return (
    <Container size="md" className="pt-16">
      <Title order={1} className="text-center mb-8">
        Welcome to the Beantown Baby Diaper Bank
      </Title>
      <Text className="text-center mb-8">
        We are a non-profit organization dedicated to providing diapers to
        families in need in the Boston area.
      </Text>
      <div className="text-center">
        <Button size="lg" component="a" href="/donate">
          Donate Now
        </Button>
      </div>
    </Container>
  );
}
