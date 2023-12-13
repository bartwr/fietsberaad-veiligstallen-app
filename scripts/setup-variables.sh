ENVIRONMENT=testcreate
gh api --method PUT -H "Accept: application/vnd.github+json" repos/mosbuma/fietsberaad-veiligstallen-app/environments/$ENVIRONMENT 
gh variable set -e $ENVIRONMENT -r mosbuma/fietsberaad-veiligstallen-app -f ./scripts/variables.env
