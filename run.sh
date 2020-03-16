read -p "Enter the number of connections you want to have to: " numberConn
read -p "Enter the file you want to broadcast: " file
export file=$file
export NumberOfRequiredConnections=$numberConn
node server.js
//"file"=file "NumberOfRequiredConnections"=numberConn node server.js