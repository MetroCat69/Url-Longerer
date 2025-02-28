# install docker in Debian 11/WSL2

# prerequisites
sudo apt-get update
sudo apt-get dist-upgrade
sudo apt-get install ca-certificates curl wget gnupg lsb-release apt-transport-https
 
# systemd-genie requires dotnet runtime, add Microsoft repo
wget https://packages.microsoft.com/config/debian/11/packages-microsoft-prod.deb -O /tmp/packages-microsoft-prod.deb
sudo dpkg -i /tmp/packages-microsoft-prod.deb
rm /tmp/packages-microsoft-prod.deb
 
# add systemd-genie repo
sudo wget -O /etc/apt/trusted.gpg.d/wsl-transdebian.gpg https://arkane-systems.github.io/wsl-transdebian/apt/wsl-transdebian.gpg
sudo chmod a+r /etc/apt/trusted.gpg.d/wsl-transdebian.gpg
echo -e "deb https://arkane-systems.github.io/wsl-transdebian/apt/ $(lsb_release -cs) main
deb-src https://arkane-systems.github.io/wsl-transdebian/apt/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/wsl-transdebian.list > /dev/null
 
# install systemd-genie
sudo apt-get update
sudo apt-get install systemd-genie
 
# install docker
curl https://get.docker.com | sh
 
# allow docker commands to be used without sudo
sudo usermod -aG docker $USER
 
# nftables is the default implementation of iptables on Debian but requires linux kernel 5.8+ which is not available on WSL2
# https://patrickwu.space/2021/03/09/wsl-solution-to-native-docker-daemon-not-starting/
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
 
# install docker-compose 1.x
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
 
sudo systemctl start docker
sudo dockerd
docker run hello-world
