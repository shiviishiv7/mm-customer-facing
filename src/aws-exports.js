/* eslint-disable */
const awsmobile = {
    "aws_project_region": "ap-south-1",
    "aws_cognito_region": "ap-south-1",
    "aws_user_pools_id": "ap-south-1_5k8fSKaS1",
    "aws_user_pools_web_client_id": "2pkn9o3tirfgob7p2ggspolkro",
    "oauth": {
        "domain": "ap-south-15k8fskas1.auth.ap-south-1.amazoncognito.com",
        "scope": ["phone", "openid", "email"],
        "redirectSignIn": "https://d84l1y8p4kdic.cloudfront.net",
        "redirectSignOut": "https://d84l1y8p4kdic.cloudfront.net",
        "responseType": "code"
    },
    "aws_cognito_username_attributes": ["EMAIL"],
    "aws_cognito_social_providers": [],
    "aws_cognito_signup_attributes": ["EMAIL", "NAME"],
    "aws_cognito_mfa_configuration": "OFF",
    "aws_cognito_mfa_types": ["SMS"],
    "aws_cognito_password_protection_settings": {
        "passwordPolicyMinLength": 8,
        "passwordPolicyCharacters": []
    },
    "aws_cognito_verification_mechanisms": ["EMAIL"]
};
export default awsmobile;
