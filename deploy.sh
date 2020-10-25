npm run build

zip -r function.zip node_modules/ build/

aws lambda update-function-code --function-name alexa-rain-gauge --zip-file fileb://function.zip