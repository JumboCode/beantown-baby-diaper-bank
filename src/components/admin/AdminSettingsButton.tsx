"use client";

import { ActionIcon } from "@mantine/core";
import Image from "next/image";
import Link from "next/link";

export default function SettingsButton() {
    return (
        <ActionIcon
            component={Link}
            href="/admincontrols"
            variant="subtle"
            color="gray"
            size="lg"
        >
            <Image
                src="/admin_view/settings.svg"
                alt="Settings"
                width={20}
                height={20}
            />
        </ActionIcon>
    );
}
