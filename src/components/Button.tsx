import React, {useState} from "react";

// specifies the type for the prop, helpful when mutliple props are passed in
interface props{
    label: string;
}

// should take a single prop 'label' and render a button with that label
function MyButton({label}: props) {
    const [age, setAge] = useState(null);
    const [firstName, setFirstName] = useState('');

    // fetch API info 
    function handleClick() {
        fetch(`https://api.agify.io?name=${firstName}`)
            .then(response => response.json())
            .then(data => {
                console.log(data.age);
                setAge(data.age);
            });
    }

    return (
        <div>
            <input 
                type="text"
                placeholder="first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)} />
            <button onClick={handleClick}>{label}</button>
            {/* below handles the case where age is null, will just ask user to put another name */}
            {age? <p>Your true age is {age? age : "unknown"}, you liar!</p>:
                  <p>Type in a valid name so we can find out your real age!</p>}
        </div>
    );
}

export default MyButton;