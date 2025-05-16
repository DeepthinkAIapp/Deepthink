Using the Ollama API to run LLMs and generate responses locally
#
llm
#
machinelearning
#
python
#
opensource
Ollama allows us to run open-source Large language models (LLMs) locally on our system. If you don't have Ollama installed on your system and don't know how to use it, I suggest you go through my Beginner's Guide to Ollama. It will guide you through the installation and initial steps of Ollama.
In this article, I am going to share how we can use the REST API that Ollama provides us to run and generate responses from LLMs. I will also show how we can use Python to programmatically generate responses from Ollama.

Steps
Ollama API is hosted on localhost at port 11434. You can go to the localhost to check if Ollama is running or not.
We will use curl in our terminal to send a request to the API. curl http://localhost:11434/api/generate -d '{ "model": "llama2-uncensored", "prompt": "What is water made of?" }' Here I am using the llama2-uncensored model but you can use any available models that you downloaded through Ollama. We can also send more parameters such as stream, which when set to false will only return a single JSON object as a response.Curl to Ollama
Now, as we see, the /api/generate endpoint is used to generate a response/completion for a given prompt. There are various endpoints that we can use for different purposes. You can check them out at the API Documentation of Ollama.
Generating Responses through Ollama API using Python
Now that we know about the REST API Ollama provides, we can use Python to generate responses programmatically.

Create a python file. Import requests and json library. import requests import json
Create the url, headers, and data variables with values like the image belowvariable declaration
Now use the post method of the response library and pass in the url, headers, and data variables that we created above. Store the response in a variable. response = requests.post(url, headers=headers, data=json.dumps(data))
Now check the status code of the response. If it is 200, print the response text, else print the error. We can extract the exact response text from the JSON object like the snapshot below.Response text
Run the program :)
The complete snapshot of the code is attached below.
Code snapshot

Conclusion
By following the steps above you will be able to run LLMs and generate responses locally using Ollama via its REST API. You can now use Python to generate responses from LLMs programmatically. Ollama is an amazing tool and I am thankful to the creators of the project!