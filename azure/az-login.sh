set -o allexport; source .env; set +o allexport

az login --service-principal -u $AZURE_SERVICE_PRINCIPAL_NAME -p $AZURE_SECRET --tenant $AZURE_TENANT
