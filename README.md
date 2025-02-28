# Degree Day App Server

## Back-End

The back end of this project is written using Typescript. The tought behind making the switch from JavaScript to TypeScript was to type check the information that is getting parsed and sent to the front end. It connects to mongoDB through mongoose and Express.js, as well as accepting a post request to handle the async data pull and a /get to check health status of the server. 

# Functions

- Fetching functions pull data from the mongoDB database and store them in variables
- Sorting function to sort the data and store them in variables. It can calculate the day high, low, current, and average for Temperature and Humidity.
- Store data functions, vary from sorting metrics and then storing them to coversions for tempature and rainfall

# Back-End tech used

- TypeScript
- Node.js
- Express.js
- Mongoose


# Run / Build

- npm run start