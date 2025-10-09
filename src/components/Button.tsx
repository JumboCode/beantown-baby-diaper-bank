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
        <div className="text-2xl flex flex-col items-center justify-center bg-[#EECDCC] h-screen space-y-5">
            <div className="flex justify-center items-center gap-4">
                <input
                    className="px-5 py-2.5 border-solid border-2 border-[#5F5971] rounded-xl bg-[#F1E9DA]"
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}/>
                <button 
                    className="bg-[#5F5971] hover:bg-[#2E294E] text-[#F1E9DA] rounded-xl px-5 py-3" 
                    onClick={handleClick}>{label}</button>
            </div>
            {/* below handles the case where age is null, will just ask user to put another name */}
            <div className=" flex justify-center items-center">
                {age? <p>Your true age is {age? age : "unknown"}, you liar!</p>:
                  <p>Type in a valid name so we can find out your real age!</p>}
            </div> 
        </div>
    );
}

export default MyButton;