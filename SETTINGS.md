# Settings

## Linear API Configuration
The Mo plugin uses environment variables for sensitive credentials:

- `LINEAR_API_KEY`: Your Linear API key (stored in `.env` file, not committed to Git)
- `LINEAR_TEAM_ID`: Your Linear Team ID (stored in `.env` file, not committed to Git)

### How to Set Up Credentials

1. Create a `.env` file in the project root
2. Add your Linear API credentials:
   ```
   LINEAR_API_KEY=your_api_key_here
   LINEAR_TEAM_ID=your_team_id_here
   ```
3. The `.env` file is already in `.gitignore` to prevent committing credentials

## Extension Settings
- Update Frequency: 5 minutes
- Log Location: FEATURE_PLANS.md 