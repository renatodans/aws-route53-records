import { getBooleanInput, getInput, setFailed } from "@actions/core";
import {
    AliasTarget,
    Change,
    ChangeResourceRecordSetsCommand,
    ChangeResourceRecordSetsCommandInput,
    ListResourceRecordSetsCommand,
    ResourceRecordSet,
    Route53Client
} from "@aws-sdk/client-route-53";


export async function run() {
    try {
        const hostedZoneId = getInput("hostedZoneId");
        const recordName = getInput("recordName");
        const recordType = getInput("recordType");

        const useAlias = getBooleanInput("useAlias");
        const resourceValue = getInput("resourceValue");

        const filter = {
            HostedZoneId: hostedZoneId,
            StartRecordName: (recordName.charAt(recordName.length - 1) == ".") ? recordName : recordName + ".",
            StartRecordType: recordType,
            MaxItems: 1,
        };

        const client = new Route53Client({});

        const listCommand = new ListResourceRecordSetsCommand(filter);
        const listResponse = await client.send(listCommand);

        if (listResponse?.ResourceRecordSets?.length == 0) {

            var resourceRecordSet = {} as ResourceRecordSet;
            resourceRecordSet.Name = recordName;
            resourceRecordSet.Type = recordType;

            if (useAlias) {
                var aliasTarget = JSON.parse(resourceValue) as AliasTarget;
                resourceRecordSet.AliasTarget = aliasTarget;
            } else {
                resourceRecordSet.ResourceRecords = [{
                    Value: resourceValue
                }]
            }

            var change = {} as Change;
            change.Action = "CREATE";
            change.ResourceRecordSet = resourceRecordSet;

            var input = {} as ChangeResourceRecordSetsCommandInput;
            input.HostedZoneId = hostedZoneId;
            input.ChangeBatch = {
                Changes: [change]
            };

            const changeCommand = new ChangeResourceRecordSetsCommand(input);
            await client.send(changeCommand);

            console.log(`Record ${recordName}, created.`);
        } else {
            console.log(`Record ${recordName}, already exists.`);
        }

    } catch (error) {
        setFailed((error as Error)?.message ?? "Unknown error");
    }
}

run();
