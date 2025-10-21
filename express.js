const express = require('express');
const app = express();
const port = 8080;

//Define routes for GET requests to the root URL
app.get('/', (req, res) => {
    res.send('Hello world from express!');
})

//start the server
app.listen(port, () =>{
    console.log('Example app listening at http://localhost:', port);
});

app.post()