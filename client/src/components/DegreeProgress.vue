<template>
  <v-row dense>
    <v-col>
      <!-- {{ details }} -->
      <v-card class="elevation-5">
        <v-card-title> {{ title }} </v-card-title>
        <v-card-subtitle>
          {{ subtitle2 }} <br />
          {{ subtitle }}
        </v-card-subtitle>
        <v-data-table
          :headers="degree_status_headers"
          :items="details"
          :hide-default-footer="true"
          disable-pagination
          :loading="loading"
          dense
          item-key="id"
          :item-class="getClass"
        >
        </v-data-table>
      </v-card>
    </v-col>
    <v-col cols="12">
      <v-card class="elevation-5">
        <!-- <v-card-title> Additional Actions </v-card-title> -->
        <v-container v-show="this.$store.state.loggedInUser.isGPD">
          <v-row align="center" justify="center">
            <v-col align="center">
              <!-- <v-btn
                :disabled="disableClearGraduation"
                text
                color="primary"
                @click="clearForGraduation()"
                >Clear for Graduation</v-btn
              > -->
              <v-dialog v-model="dialog2" max-width="50%">
                <template v-slot:activator="{ on }">
                  <!-- <v-btn
                    text
                    color="primary"
                    v-bind="attrs"
                    v-on="on"
                    >Add Proficiency Requirement</v-btn
                  > -->
                  <v-btn
                    :disabled="disableClearGraduation"
                    v-on="on"
                    text
                    color="primary"
                    >Clear for Graduation</v-btn
                  >
                </template>
                <v-card>
                  <v-card-title>
                    <span class="headline"
                      >Confirmation: clear this student for graduation?</span
                    >
                  </v-card-title>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeDialog2"
                      >Cancel</v-btn
                    >
                    <v-btn color="blue darken-1" text @click="clearForGraduation"
                      >Submit</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-col>

            <v-col align="center">
              <v-dialog v-model="dialog" max-width="50%">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    :disabled="disableAddProficiency"
                    text
                    color="primary"
                    v-bind="attrs"
                    v-on="on"
                    @click="addProficiency()"
                    >Add Proficiency Requirement</v-btn
                  >
                </template>
                <v-card>
                  <v-card-title>
                    <span class="headline">Add Proficiency Requirement</span>
                  </v-card-title>

                  <!-- ADD PROFICIENCY REQUIREMENT DIALOG -->
                  <v-card-text>
                    <v-container>
                      <v-form ref="form" onSubmit="return false;">
                        <v-row>
                          <v-col cols="6">
                            <v-text-field
                              label="Department"
                              value="CSE"
                              disabled
                            ></v-text-field>
                          </v-col>
                          <v-col cols="6">
                            <v-autocomplete
                              label="Course Number"
                              v-model="selectedProficiencyRequirementClass"
                              :items="profiencyRequirementClasses"
                            ></v-autocomplete>
                            <!-- <div>{{ selectedProficiencyRequirementClass }}</div> -->
                          </v-col>
                        </v-row>
                      </v-form>
                    </v-container>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeDialog"
                      >Cancel</v-btn
                    >
                    <v-btn
                      :disabled="!this.selectedProficiencyRequirementClass"
                      color="blue darken-1"
                      text
                      @click="submitProficiency"
                      >Submit</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import APIService from "../APIService";

export default {
  data() {
    return {
      dialog: false,
      dialog2: false,
      title: "Degree Progress",
      subtitle2: "",
      subtitle: "",
      degreeStatus: {},
      loading: true,
      details: [],
      disableClearGraduation: true,
      disableAddProficiency: true,
      profiencyRequirementClasses: [
        "580",
        "581",
        "582",
        "583",
        "584",
        "585",
        "586",
        "587",
        "588",
        "589",
      ],
      selectedProficiencyRequirementClass: "",
      degree_status_headers: [
        { text: "#", value: "id" },
        { text: "Description", value: "description" },
        { text: "Satisfied By", value: "satisfiedBy" },
        {
          text: "Semester",
          value: "SemesterYear",
          sort: function (a, b) {
            a = a.split(" ");
            b = b.split(" ");
            return (
              a[1] - b[1] ||
              ["Winter", "Spring", "SummerI", "SummerII", "Fall"].indexOf(
                a[0]
              ) -
                ["Winter", "Spring", "SummerI", "SummerII", "Fall"].indexOf(
                  b[0]
                )
            );
          },
        },
        { text: "Grade", value: "grade" },
        { text: "Status", value: "status" },
      ],
    };
  },
  methods: {
    closeDialog() {
      this.dialog = false;
    },

    closeDialog2() {
      this.dialog2 = false;
    },

    getClass(item) {
      // console.log(item);
      if (item.status == "Unsatisfied") {
        const myClass = "unsatisfied";
        return myClass;
      } else if (item.status == "Pending") {
        const myClass = "pending";
        return myClass;
      } else if (item.status == "Satisfied") {
        const myClass = "satisfied";
        return myClass;
      }
    },

    async refetchTable() {
      this.loading = true;
      // get degree status object
      this.degreeStatus = await APIService.get(
        "/api/student/degreestatus/" + this.$store.state.selectedID
      );

      // fill in table + other display elements
      this.title =
        "Degree Progress: " +
        this.degreeStatus.department +
        " " +
        this.degreeStatus.track;

      this.subtitle2 =
        "Requirement Status: " + this.degreeStatus.requirementsStatus;
      this.subtitle = this.degreeStatus.satisfied
        ? "Satisfied " +
          this.degreeStatus.satisfied +
          ", Pending " +
          this.degreeStatus.pending +
          ", Unsatisfied " +
          this.degreeStatus.unsatisfied
        : "";

      this.details = this.degreeStatus.details2;

      this.disableAddProficiency =
        this.degreeStatus.department !== "CSE" ||
        this.degreeStatus.requirementsStatus === "Graduated";
      this.disableClearGraduation =
        this.degreeStatus.requirementsStatus !== "Satisfied";

      this.loading = false;
    },

    async clearForGraduation() {
      await APIService.put("/api/student/" + this.$store.state.selectedID, {
        graduated: true,
        ignoreTimeStamp: true,
      });
      this.refetchTable();
      // this.disableClearGraduation = true;
      // this.disableAddProficiency = true;
      this.closeDialog2();
    },

    async addProficiency() {
      this.selectedProficiencyRequirementClass = "";
    },

    async submitProficiency() {
      let res = await APIService.post(
        "/api/student/proficiency/" + this.$store.state.selectedID,
        {
          department: "CSE",
          course_num: this.selectedProficiencyRequirementClass,
        }
      );

      if (res.status === 200) {
        this.refetchTable();
      }
      this.closeDialog();
    },
  },

  async created() {
    if (
      this.$store.state.selectedID === "N/A" &&
      this.$store.state.loggedInUser.isGPD
    ) {
      this.$router.push("gpdhomepage");
      return;
    }

    this.refetchTable();
  },
};
</script>
<style lang="css">
.unsatisfied td {
  background-color: rgba(255, 0, 0, 0.1);
}
.satisfied td {
  background-color: rgba(0, 255, 0, 0.1);
}
.pending td {
  background-color: rgba(255, 255, 0, 0.1);
}
</style>
