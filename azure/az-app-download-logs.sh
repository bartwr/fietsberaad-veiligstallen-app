set -o allexport; source .env; set +o allexport

az webapp log download --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP --log-file ./logfiles.zip
