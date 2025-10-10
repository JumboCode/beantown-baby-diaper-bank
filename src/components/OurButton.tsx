import { useState } from "react";

export default function OurButton() {
    const [name, setName] = useState("");
    const [age, setAge] = useState(0);
    const fetchAge = async (name: string) => {
        const response = await fetch(
            `https://api.agify.io?name=${name}`
        );
        const data = await response.json();
        setAge(data.age);
    }

    return (
      <div className="flex items-center justify-center h-screen">

      <div>
      <form id="form"
        onSubmit={async (e) => {
        e.preventDefault();
        await fetchAge(name);
      }}
      >
        <input 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="outline outline-solid p-2 rounded"
        />
        <button type="submit" className={"bg-teal-700 text-white p-2 rounded-lg m-2"}>Submit</button>
        
      </form>

      {age !== 0 && <h4 className="text-2xl text-center text-teal-700"> Age: {age}</h4>}

      </div>

      </div>
        
    );
}