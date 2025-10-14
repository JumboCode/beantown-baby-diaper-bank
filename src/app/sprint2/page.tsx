"use client";

import { Container, Title, Paper, Text } from "@mantine/core";
import OurSlider from "../../components/OurSlider";
import DotPopUps from '@/components/DotPopUps';

export default function Sprint2Page() {
    return (
        <Container
            size="sm"
            py="xl">
            <Paper
                shadow="md"
                p="xl"
                radius="md"
                withBorder>
                <Title
                    order={1}
                    mb="md">
                    Sprint 2 Page
                </Title>
            </Paper>

            <Title
                order={2}
                mt="md"
                mb="xs">
                Fun Slider
            </Title>
            <Text
                c="dimmed"
                mb="xl">
                Place fun slider ticket here
            </Text>
            <div><OurSlider /></div>

            <Title
                order={2}
                mt="md"
                mb="xs">
                MAKE AN IMPACT
            </Title>
            <Text
                c="dimmed"
                mb="xl">
                Place make an impact ticket here
            </Text>
            <div>{/* MAKE an Impact component goes here */}</div>

            <Title
                order={2}
                mt="md"
                mb="xs">
                File Upload Button
            </Title>
            <Text
                c="dimmed"
                mb="xl">
                Place file upload button ticket here
            </Text>
            <div>{/* File Upload Button component goes here */}</div>

            <Title
                order={2}
                mt="md"
                mb="xs">
                Displaying City Info
            </Title>
            <Text
                c="dimmed"
                mb="xl">
                Place displaying city info ticket here
            </Text>
            <div>{/* Displaying City Info component goes here */}</div>
            <Title
                order={2}
                mt="md"
                mb="xs">
                Displaying City Info
            </Title>
            <Text
                c="dimmed"
                mb="xl">
                Place displaying city info ticket here
            </Text>
            <div>{<DotPopUps />}</div>

            <Title
                order={2}
                mt="md"
                mb="xs">
                Tooltips!
            </Title>
            <Text
                c="dimmed"
                mb="xl">
                Place tooltips ticket here
            </Text>
            <div>{/* Tooltips component goes here */}</div>

            <Title
                order={2}
                mt="md"
                mb="xs">
                Yearly vs Monthly Switch
            </Title>
            <Text
                c="dimmed"
                mb="xl">
                Place yearly vs monthly switch ticket here
            </Text>

            <div>{/* Yearly vs Monthly Switch component goes here */}</div>
        </Container>
    );
}
