@echo off
echo Testing authentication endpoints...
echo.

echo 1. Testing health endpoint (should work)...
curl -s -o nul -w "Status: %%{http_code}\n" http://localhost:5000/api/health
echo.

echo 2. Testing auth user endpoint (should be 401)...
curl -s -o nul -w "Status: %%{http_code}\n" http://localhost:5000/api/auth/user
echo.

echo 3. Testing login endpoint...
curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"password\":\"testpass\"}" -s -o nul -w "Status: %%{http_code}\n" http://localhost:5000/api/auth/local/login
echo.

echo Test completed!
