FROM amazonlinux:2.0.20190228
##############UPDATE the image 
RUN rpm -ivh https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
RUN yum -y update
RUN yum -y install yum-utils
RUN yum -y groupinstall development
RUN yum install -y gcc openssl-devel bzip2-devel libffi-devel wget
RUN yum -y install https://centos7.iuscommunity.org/ius-release.rpm     

##############INSTALL nodejs
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 8.10.0
WORKDIR $NVM_DIR
RUN curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default
ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:/root/.local/bin:/app/pipeline-script/bin:$PATH

##############FETCH application place on image
RUN mkdir -p /app /logs
COPY . /app 
WORKDIR /app
RUN npm install
############## Environment variables
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
############## VERIFY variables
RUN echo $(date)
RUN echo $PATH
