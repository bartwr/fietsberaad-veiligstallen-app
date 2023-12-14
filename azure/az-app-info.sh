set -o allexport; source .env; set +o allexport

az webapp show --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP

az webapp config appsettings list --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP
