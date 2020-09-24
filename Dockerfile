# Start from a Debian image with the latest version of Go installed
# and a workspace (GOPATH) configured at /go.
FROM golang:1.13

RUN mkdir -p /go/src/app
WORKDIR /go/src/app

COPY go.mod .
COPY go.sum .

RUN go mod download
COPY . .

RUN go build -o /go/src/app/bjjmap

ENTRYPOINT ["/go/src/app/bjjmap"]
