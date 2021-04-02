set -xe

function setup {
  docker-compose up --detach --remove-orphans
}

function cleanup {
  docker-compose down
}

setup
trap cleanup EXIT

npm run test