'use client';
import React, { useState } from "react";
import { Title } from "@mantine/core";
import { getSystemErrorName, styleText } from "util";
import { fetchExternalImage } from "../../node_modules/next/dist/server/image-optimizer";

export default function OnboardingTicket() {
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<number | null>(null);
  const [ loading, setLoading] =  useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchAge = async () => {
    setLoading(true);
    setError('');
    setAge(null);
    
    fetch(`https://api.agify.io?name=${name}`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        console.log(data.age);
        setAge(data.age);
      })
      .catch(() => {
        setError('Failed to fetch the age, try again!');
      })
      .finally(() => {
        setLoading(false);
      });
  }
  
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Age Finder</h2>

      {/* Input field for name */}
      <input
        type="text"
        placeholder="Enter a first name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && fetchAge()}
        style={styles.input}
      />

      {/* Button to fetch age */}
      <button
        onClick={fetchAge}
        disabled={loading}
        style={{
          ...styles.button,
          ...(loading ? styles.buttonDisabled : {}),
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = "#0056b3";
            e.currentTarget.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = "#007bff";
            e.currentTarget.style.transform = "scale(1)";
          }
        }}
      >
        {loading ? "Loading..." : "Find Age"}
      </button>

      {/* Display age result */}
      {age !== null && (
        <div style={styles.result}>
          <p style={styles.resultText}>
            The estimated age for <strong>{name}</strong> is: <strong>{age}</strong> years old
          </p>
        </div>
      )}

      {/* Display error message */}
      {error && (
        <div style={styles.error}>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}
    </div>
  );
};


// Styling for the component
const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    fontFamily: "Arial, sans-serif",
    maxWidth: "500px",
    margin: "0 auto",
  },
  title: {
    color: "#333",
    marginBottom: "1.5rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    fontSize: "1rem",
    border: "2px solid #ddd",
    borderRadius: "8px",
    marginBottom: "1rem",
    outline: "none",
    transition: "border-color 0.3s",
  },
  button: {
    padding: "0.75rem 2rem",
    fontSize: "1rem",
    fontWeight: "bold" as const,
    color: "white",
    backgroundColor: "#007bff",
    borderWidth: 2,
    borderStyle: 'solid' as const,
    borderColor: '#007bff',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  buttonDisabled: {
    backgroundColor: "#6c757d",
    borderColor: "#6c757d",
    cursor: "not-allowed",
  },
  result: {
    marginTop: "1.5rem",
    padding: "1rem",
    backgroundColor: "#d4edda",
    border: "1px solid #c3e6cb",
    borderRadius: "8px",
    width: "100%",
  },
  resultText: {
    margin: 0,
    color: "#155724",
    fontSize: "1.1rem",
  },
  error: {
    marginTop: "1.5rem",
    padding: "1rem",
    backgroundColor: "#f8d7da",
    border: "1px solid #f5c6cb",
    borderRadius: "8px",
    width: "100%",
  },
  errorText: {
    margin: 0,
    color: "#721c24",
  },
};

