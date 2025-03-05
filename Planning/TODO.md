1. create basic url crd done
1. add tests done
1. add check if link exists before insert done,
1. add local development local done
1. add redirection at get done
1. add users done
1. add links table and delete links on user deletion delete link delete linker done
1. redo code done
1. REDO API TO MAKE IT MORE STANDERDISED done
1. add integration tests done
1. redo unit tests [too time consuming]
1. actual short url done
1. add get user done
1. cachce done
1. log groups done
1. better logging [use logger class so logs will be shown in one place and wont spam me] done (apperently I it is already streaming to cloudwatch)

1. authontication
1. link exparation
1. add soft deletes
1. add get all users urls
1. refactor cdk to be more SOLID
1. make sure link clicks is counted based on user click counter and agrigation
1. analytics
1. authontication
1. security [rate limits, ip banning, over cloud features]
1. data enginiring

## TODO BUGS THAT AROSE

make sure user exists before writing (auth)
deleting nothing results in succses
make user id be generated in the backend
should prevent deleting URL with incorrect userId (not your own)
RETURN SPECIFIC ERROR IF TRYING TO CREATE URL OR USER TWICE
return specifc error if deleting none existing user url
remove errors from api only in dev
api schema

write design decition challenges selution

1. using local env vars for table names
1. on delete delete all stuff from aws
1. using gsi to retrive user url fast
1. shadow delete
1. why lambda
1. why dynamo
1. local stack stuff that happpaned
