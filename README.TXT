############################################################
## To execute the process to load data from mongo to braze
#
############################################################

AWS BATCH -
docker run -e "MONGO_SERVER_CONNECTION=" -e "BRAZE_API_KEY=" -e "CUSTOMER_ATTRIB_COLLECTION=computed.customer_attributes" -e "BRAZE_URL=https://rest.iad-03.braze.com/"  -it --name=sync2braze-caf sync2braze-caf:latest node server.js real $(date -I)




############################################################
## commands to execute the services inside c360
#
############################################################

Usage: server [options] [command]

Options:
  -h, --help                                                          output usage information

Commands:
  realtimePush|real <fromDate> [toDate]                               Real Time Pipeline
  manualSyncEmailOptout|manualopt <skip> <total> <fromDate> [toDate]  manual sales force email opt out sync to braze
  salesForceOpt|realopt <fromDate> [toDate]                           sales force email opt out sync to braze
  manualPush|manual <skip> <limit> <fromDate> [toDate]                Manual Push to Braze
  syncToBrazeFromCSV|optcsv                                           Sync to BRaze from CSV
  deleteUserByExternalIds|delbi                                       Delete User By braze Id 