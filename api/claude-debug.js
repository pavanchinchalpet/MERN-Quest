import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function debugAuth() {

const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1000,
  messages: [
    {
      role: "user",
      content: `
Debug this authentication issue.

Problem:
Login API returns 401 even after correct credentials.

Code:
PASTE YOUR AUTH CODE HERE
`
    }
  ]
});

console.log(response.content[0].text);
}

debugAuth();