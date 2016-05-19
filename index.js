const express = require("express")
const app = express()

app.use(express.static('public'))

app.listen(8000, "0.0.0.0", function () { 
	console.log('Simple gmail app listening on port 8000')
})