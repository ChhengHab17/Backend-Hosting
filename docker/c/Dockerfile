FROM gcc:latest

# Install expect for unbuffered terminal I/O
RUN apt-get update && apt-get install -y expect

WORKDIR /app

# Just drop into bash by default
CMD ["/bin/bash"]