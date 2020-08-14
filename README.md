# Update Lambda
`zip -r function.zip node_modules/ src/ index.js`
`aws lambda update-function-code --function-name alexa-rain-gauge --zip-file fileb://function.zip`