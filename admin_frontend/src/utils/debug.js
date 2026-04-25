// Quick debugging - check if backend is responding

const testBackend = async () => {
  console.log("🔍 Testing Backend Connection...");

  try {
    console.log("Testing: http://localhost:3200/products");
    const response = await fetch("http://localhost:3200/products");
    console.log("Response status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error("Error response:", error);
      return;
    }

    const data = await response.json();
    console.log("✅ Success! Data:", data);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.error("Make sure backend server is running on http://localhost:3200");
  }
};

// Run test
testBackend();
