import React from "react";
import { useState } from "react";
import { Button, Input } from "@mantine/core";

type ButtonComponentProp = {
  label: string;
};

const ButtonComponent = ({ label }: ButtonComponentProp) => {
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState(0);

  const updateFirstName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.currentTarget.value);
  };

  const apiCaller = () => {
    console.log("inside apiCaller");
    fetch("https://api.agify.io?name=" + firstName)
      .then((response) => response.json())
      .then((data) => setAge(data.age));
  };

  return (
    <div>
      <Input
        placeholder="First Name"
        value={firstName}
        onChange={updateFirstName}
      />
      <Button
        onClick={apiCaller}
        styles={{
          root: {
            backgroundColor: "#FF69B4",
            "--button-hover-color": "#b52b70ff",
          },
        }}>
        {label}
      </Button>
      <p>{age}</p>
    </div>
  );
};

export default ButtonComponent;
