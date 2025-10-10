import { Title } from "@mantine/core";
import Button from "@/components/Button";
import { Input } from "@mantine/core";
import { useState } from "react";

export default function ElchinMadelineButton() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
  };

  const getAge = async () => {
    try {
      fetch(`https://api.agify.io/?name=${name}`)
        .then((response) => response.json())
        .then((data) => {
          setText(data.age);
          setShow(true);
        });
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  };
  return (
    <>
      <Title order={3}>
        Your work on the onboarding ticket will go here...
      </Title>
      <div className="w-fit flex gap-3 mt-3">
        <Input
          placeholder="Input Name"
          onChange={handleChange}
        />
        <Button
          label={"Get age!"}
          onClick={getAge}
        />
      </div>
      <p className="mt-3 text-lg">
        {show && (text ? "Age: " + text : "Unable to get age")}
      </p>
    </>
  );
}
