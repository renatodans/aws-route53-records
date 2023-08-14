import { getInput, setFailed } from "@actions/core";
import { 
    ChangeResourceRecordSetsCommand, 
    ChangeResourceRecordSetsCommandInput, 
    ListResourceRecordSetsCommand, 
    Route53Client 
} from "@aws-sdk/client-route-53";


export async function run() {
    try {
        const hostedZoneId = getInput("hostedZoneId");
        const recordName = getInput("recordName");
        const recordType = getInput("recordType");
        const resourceValue = getInput("resourceValue");

        const client = new Route53Client({});

        const filter = {
            HostedZoneId: hostedZoneId,
            StartRecordName: recordName,
            StartRecordType: recordType,
            MaxItems: 1,
        };

        const listCommand = new ListResourceRecordSetsCommand(filter);
        const listResponse = await client.send(listCommand);

        if (listResponse == null) {
            var input = {} as ChangeResourceRecordSetsCommandInput;
            input.HostedZoneId = hostedZoneId;
            input.ChangeBatch = {
                Changes: [
                    {
                        Action: "CREATE",
                        ResourceRecordSet: {
                            Name: recordName,
                            Type: recordType,
                            ResourceRecords: [
                                {
                                    Value: resourceValue
                                }
                            ]
                        }
                    }
                ]
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
