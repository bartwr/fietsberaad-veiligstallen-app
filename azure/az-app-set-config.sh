set -o allexport; source .env; set +o allexport

# 
az webapp config set --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP --startup-file "node server.js"

