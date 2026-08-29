# SocialPilot Database Schema

## Users
- id
- name
- email
- password_hash
- role_id
- created_at
- updated_at

## Roles
- id
- name

## Teams
- id
- name
- created_at

## Social Accounts
- id
- user_id
- platform
- account_name
- access_token
- created_at