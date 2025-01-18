import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as path from "path";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";

export class CdkStepFunctionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const usersLambdaFunction = new NodejsFunction(
      this,
      "MyUsersLambdaFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, "..", "lambda", "users-function.ts"),
        handler: "handler",
        timeout: cdk.Duration.seconds(10),
      }
    );

    const outputLambdaFunction = new NodejsFunction(
      this,
      "MyOutputLambdaFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, "..", "lambda", "output-function.ts"),
        handler: "handler",
        timeout: cdk.Duration.seconds(10),
      }
    );

    // ユーザー一覧出力 Lambda 関数の呼び出し
    const invokeUsersLambdaTask = new tasks.LambdaInvoke(
      this,
      "MyUsersLambdaTask",
      {
        lambdaFunction: usersLambdaFunction,
        resultSelector: {
          "users.$": "$.Payload.users",
          "fail.$": "$.Payload.fail",
        },
      }
    );

    const invokeOutputLambdaTask = new tasks.LambdaInvoke(
      this,
      "MyOutputLambdaTask",
      {
        lambdaFunction: outputLambdaFunction,
      }
    );
    // 20歳以上のユーザーのみを処理する Output Lambda 関数の呼び出し
    const invokeOutputLambdaTaskOver20 = new tasks.LambdaInvoke(
      this,
      "MyOutputLambdaTaskOver20",
      {
        lambdaFunction: outputLambdaFunction,
      }
    );
    // 年齢によって Lambda 関数を切り替えるための Choice の定義
    const ageChoice = new sfn.Choice(this, "MyAgeChoice")
      .when(
        sfn.Condition.numberGreaterThanEquals("$.user.age", 20),
        invokeOutputLambdaTaskOver20
      )
      .otherwise(invokeOutputLambdaTask);

    // Map の定義
    const map = new sfn.Map(this, "MyMap", {
      maxConcurrency: 10,
      itemsPath: "$.users",
      itemSelector: {
        "user.$": "$$.Map.Item.Value",
      },
    });
    map.itemProcessor(ageChoice).next(new sfn.Succeed(this, "Succeed"));

    // Fail の場合の Choice の定義
    const failChoice = new sfn.Choice(this, "MyFailChoice")
      .when(
        sfn.Condition.booleanEquals("$.fail", true),
        new sfn.Fail(this, "Fail")
      )
      .when(sfn.Condition.booleanEquals("$.fail", false), map);

    new sfn.StateMachine(this, "MyStateMachine", {
      definition: invokeUsersLambdaTask.next(failChoice),
    });
  }
}
