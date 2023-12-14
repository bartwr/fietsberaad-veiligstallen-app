set -o allexport; source .env; set +o allexport

echo restart webapp $AZURE_WEBAPP_NAME 
az webapp restart --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP
