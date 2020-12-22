# Update Lambda
`zip -r function.zip node_modules/ src/ index.js`
`aws lambda update-function-code --function-name alexa-rain-gauge --zip-file fileb://function.zip`

# TODO
- Wettest Month / Day for given year
- (Done) Wettest Day / Month / Year ever
- Days since last rain
- Create help section with list of commands
- (Done) Keep app open between questions
- Rain after holiday?
- Automatic export to s3 and excel data source