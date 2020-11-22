library(openxlsx)
library(tidyverse)
data <- read.xlsx(xlsxFile = "~/Downloads/hic04_acs.xlsx", fillMergedCells = TRUE, colNames = FALSE)
data <- data[4:581,]
new_names <- map(data[1:2,], function(x) {paste(unlist(x), collapse="_")})
names(data) <- new_names
names(data)[1] <- "state"
data <- as_tibble(data, .name_repair="unique")
data <- data %>% filter(Coverage_Coverage == "Any coverage")
data <- data %>% select(state, contains("Percent"))
names(data) <- map(names(data), function(n) {
  str_replace_all(n, "[^0-9]", "")
})
write_csv(data, "data/pct-covered-by-state.csv")
