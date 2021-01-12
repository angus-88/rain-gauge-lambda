# Update Lambda
`zip -r function.zip node_modules/ src/ index.js`
`aws lambda update-function-code --function-name alexa-rain-gauge --zip-file fileb://function.zip`

# TODO
- (Done) Keep app open between questions
- (Done) Wettest Day / Month / Year ever
- Wettest Month / Day for given year
- Longest and current dry/wet spell
- Getting records across multiple years e.g. winter
- Get totals for seasons
- Download New data and add to csv file