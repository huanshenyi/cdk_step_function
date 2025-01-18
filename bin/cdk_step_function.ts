import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkStepFunctionStack } from "../lib/cdk_step_function-stack";

const app = new cdk.App();
new CdkStepFunctionStack(app, "StepfunctionsBuilderStack", {});
