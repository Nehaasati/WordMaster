# Stage 1 — Build Frontend (Node 24)

FROM node:24-alpine AS frontend-builder
WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy source and build
COPY frontend ./frontend
RUN cd frontend && npm run build

# Stage 2 — Build Backend (.NET 10)

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-builder
WORKDIR /src

# Copy backend project files
COPY backend/*.csproj ./backend/
RUN cd backend && dotnet restore

# Copy backend source
COPY backend ./backend



# Publish backend
RUN cd backend && dotnet publish -c Release -o /app/publish --no-restore

# Stage 3 — Runtime Image

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=backend-builder /app/publish .

# Render provides PORT dynamically
ENV ASPNETCORE_URLS=http://+:${PORT}

CMD ["dotnet", "backend.dll"]