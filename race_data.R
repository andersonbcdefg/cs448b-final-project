library(openxlsx)
library(tidyverse)
data <- read.xlsx(xlsxFile = "~/Downloads/hic09_acs.xlsx", 
                  fillMergedCells = TRUE, colNames = FALSE)
new_names <- map(data[4:5,], function(x) {paste(unlist(x), collapse="_")})
names(data) <- as.vector(new_names)
data <- as_tibble(data[6:13,], .name_repair="unique")
data <- data %>% select(!contains("Total") & !contains("Margin") & !contains("Estimate"))
data_longer <- pivot_longer(data, cols=2:13, names_to="year", values_to="pct_uninsured") %>% 
  separate(
    col="year",
    into=c("year"),
    remove=TRUE,
    sep=" ",
    extra="drop"
  )
names(data_longer)[1] <- "race_group"
data_wider <- pivot_wider(data_longer, names_from=c("race_group"), values_from="pct_uninsured")
names(data_wider) <- map(names(data_wider), function(n) {
  str_replace_all(str_replace_all(tolower(n), " ", "_"), ",", "")
})
write_csv(data_wider, "data/pct_uninsured.csv")
