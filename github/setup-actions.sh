ENVIRONMENT=production
REPOSITORY=mosbuma/fietsberaad-veiligstallen-app
gh api --method PUT -H "Accept: application/vnd.github+json" repos/$REPOSITORY/environments/$ENVIRONMENT 

#publish or update the workflow variables
gh variable set -e $ENVIRONMENT -f ./github/variables.env

#publish or update secret azure publish profile (set separately because it is a multiline value)
gh secret set -a actions -e $ENVIRONMENT AZUREAPPSERVICE_PUBLISHPROFILE_VEILIGSTALLEN < ./github/vstfb-eu-acc-app01.PublishSettings
#publish or update remainder of the secrets are set in a single file
gh secret set -a actions -e $ENVIRONMENT AZUREAPPSERVICE_PUBLISHPROFILE_VEILIGSTALLEN -f ./github/secrets.env

#enable the ci/cd action
gh workflow enable azure-webapps-node.yml
